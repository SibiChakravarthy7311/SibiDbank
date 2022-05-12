import React, { Component } from 'react';
import "./CoursesMain.css";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';


class CoursesMain extends Component {
  
  async drawCertificate(id, name) {
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext("2d");
    const img = this.refs.image;

    ctx.drawImage(img, 0, 0)
    ctx.font = "50px Courier"
    ctx.fillText(this.props.account, 480, 800);
    ctx.fillText(name, 480, 1060);
    canvas.toBlob((blob) => {
      this.props.completeCourse(id, name, blob);
      // this.setState({blob: blob});
    })
  }

  changeVideoDisplayVisibility(id){
    var videoDisplay = this.state.videoDisplay;
    videoDisplay[id] = !videoDisplay[id];
    this.setState({videoDisplay: videoDisplay})
  }

  constructor(props){
    super(props);
    this.state = {
      blob: null,
      videoDisplay: this.props.videoDisplay,
    }
  }

  render() {
    console.log(this.props.courses);
    return (
      <div className="container-fluid mt-5">
        <div className='certificateCanvas hidden'>
          <canvas ref="canvas" width={2000} height={1414} crossOrigin='anonymous'/>
          <img ref="image" src={"https://i.imgur.com/QTdtDfs.png"} alt="Certificate Template" className="hidden" crossOrigin='anonymous'/>
        </div>
        <div className="row">
          <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '500px' }}>
            <div className="content mr-auto ml-auto">
              {/* <form onSubmit={(event) => {
                event.preventDefault()
                const courseName = this.courseInput.value
                const courseLink = this.courseLink.value
                this.props.addCourse(courseName, courseLink)
              }} >
                <div className="form-group mr-sm-2">
                  <br></br>
                    <input
                      id="courseInput"
                      type="text"
                      ref={(input) => { this.courseInput = input }}
                      className="form-control"
                      placeholder="Course Name..."
                      required />
                    <input
                      id="courseLink"
                      type="text"
                      ref={(input) => { this.courseLink = input }}
                      className="form-control"
                      placeholder="Course Link..."
                      required />
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg">Add Course</button>
              </form>
              <p>&nbsp;</p> */}
              { this.props.courses.map((course, key) => {
                console.log(this.props.courseCompleted);
                const courseCompletion = this.props.courseCompleted[course.id];
                const displayVideo = this.state.videoDisplay[course.id];
                console.log(course.id, courseCompletion);
                return(
                  <div className="card mb-4" key={key} >
                    <div className="card-header courseTitle">
                      <p>{course.name}</p>
                      <div className='viewSwitchContainer'>
                        <div className="NFTViewSwitcher"
                          onClick={(event) => {
                            this.changeVideoDisplayVisibility(course.id);
                          }}
                        >
                          <div className="NFTViewSwitcherButton">
                          {/* {this.state.videoDisplayText}&nbsp;&nbsp; */}
                            <div className="NFTViewSwitchIcon">
                              {
                                displayVideo ?
                                <KeyboardArrowUpIcon />
                                :
                                <KeyboardArrowDownIcon />
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <ul id="courseList" className="list-group list-group-flush">
                      {
                        displayVideo ?
                        <li className='list-group-itme'>
                          <div className='youtube-box'>
                            <iframe className='video' src={course.link} title="videoPlayer" frameborder="0" allow="fullscreen;"/>
                          </div>
                        </li>
                        :
                        <div></div>
                      }
                      <li key={key} className="list-group-item py-2 completionStatus">
                        { courseCompletion === true ? 
                          <p className='completedStatus'>Course Completed</p>
                          :
                          <button
                            className="btn btn-primary btn-sm float-right pt-0"
                            id={course.id}
                            name={course.name}
                            onClick={(event) => {
                              this.drawCertificate(course.id, course.name);
                            }}
                          >
                            COMPLETE COURSE
                          </button>
                        }
                      </li>
                    </ul>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      </div>
    );
  }
}

export default CoursesMain;
