import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
// Pulling in query that holds data for single tutorial and all of the comments and the associated category
import { useQuery, useMutation } from '@apollo/client';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { QUERY_GET_TUTORIAL_DETAILS } from '../utils/queries';
// Bringing in add comment mutation
import { ADD_COMMENT, REMOVE_COMMENT } from '../utils/mutations';
import Auth from '../utils/auth';
import '../pages/viewTutorial.css';

// Pulling a single tutorial from the queries
const GetTutorial = () => {
  const { id } = useParams();
  const { loading, data, refetch } = useQuery(QUERY_GET_TUTORIAL_DETAILS, {
    variables: { tutorialId: id }
  });

  const profileId = Auth.getProfile().data._id;

  // Adding mutation to add a comment
  // Using useState to post comment and refetch to rerender new data
  const [comment, setComment] = useState('');
  const [addComment, { error }] = useMutation(ADD_COMMENT, {
    onCompleted: () => {
      setComment('');
      refetch();
    },
    onError: (error) => console.error('Add comment Error:', error),
  });
  
  // Adding remove comment mutation, once complete refetch new data
  const [removeComment] = useMutation(REMOVE_COMMENT, {
    onCompleted: () => {
      refetch();
    },
    // Adding additional error handling for removing comment
    onError: console.error('Whoops, there was a problem removing your comment. Please try again.'),
  });

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addComment({
        variables: { profileId, tutorialId: id, content: comment }
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Handling delete button for user, using the comment id only for removal
  const handleRemoveComment = async (commentId) => {
    try {
      await removeComment({
        variables: { id: commentId }
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data || !data.tutorial) return <div>No tutorial found</div>;

  const { title, content, author, comments, category, videos } = data.tutorial;

  // Refactored viewing and commenting via dashboard. Added syntax which is identical to ViewTutorial, to keep the application structured
  return (
    <>
      <div className="tutorialDiv">
        <Card className="tutorialCard">
          <Card.Body>
            <h2 style={{ fontWeight: 'bold' }}>{title}</h2>
            <h5>By {author.name}</h5>
            <span className="badge text-bg-info">{category.name}</span>
            <div style={{ paddingTop: '5%' }}>
              <p style={{ fontSize: '18px' }}>{content}</p>
            </div>

            {videos && videos.length > 0 && (
              <div className="video-section">
                <h4>Videos</h4>
                {videos.map(video => (
                  <div key={video._id} className="video-item">
                    <h5>{video.title}</h5>
                    <div className="video-embed">
                      <iframe
                        width="560"
                        height="315"
                        src={`https://www.youtube.com/embed/${video.videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video.title}
                      ></iframe>
                    </div>
                    <p>{video.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="commentDiv">
              <div>
                <h4>Add your comment</h4>
                {Auth.loggedIn() ? (
                  <Form onSubmit={handleCommentSubmit}>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Leave a comment"
                        style={{ border: 'solid 1.5px black', marginBottom: '10px' }}
                      />
                      <div className="col-6 col-sm-3">
                        <button className="btn btn-info" type="submit">
                          Submit
                        </button>
                      </div>
                      {error && (
                        <div className="col-12 my-3 bg-danger text-white p-3">
                          {error.message}
                        </div>
                      )}
                    </Form.Group>
                  </Form>
                ) : (
                  <p>
                    You need to be logged in to add comments. Please{' '}
                    <Link to="/login">login</Link> or <Link to="/signup">signup.</Link>
                  </p>
                )}
              </div>

              <h4 style={{ fontWeight: 'bold', paddingBottom: '10px' }}>Comments</h4>
              {comments.map(comment => (
                <div key={comment._id}>
                  <span className="badge text-bg-secondary">{comment.author ? comment.author.name : 'Guest'}</span>
                  {comment.author && comment.author._id === profileId && (
                    <button className="badge text-bg-danger" style={{ marginLeft: '5px' }}
                      onClick={() => handleRemoveComment(comment._id)}>Delete</button>
                  )}
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default GetTutorial;
